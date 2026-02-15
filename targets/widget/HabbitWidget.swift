import WidgetKit
import SwiftUI

// MARK: - Data Model

struct HabitProgress: Codable {
    let completed: Int
    let total: Int
    let streak: Int
    let habits: [String]
    let done: [String]
    let updatedAt: String
}

// MARK: - Timeline Provider

struct HabbitProvider: TimelineProvider {
    let appGroup = "group.com.habbittracker.shared"

    func placeholder(in context: Context) -> HabbitEntry {
        HabbitEntry(date: Date(), completed: 3, total: 5, streak: 7, habits: ["Meditate", "Read", "Exercise", "Water", "Journal"], done: ["Meditate", "Read", "Exercise"])
    }

    func getSnapshot(in context: Context, completion: @escaping (HabbitEntry) -> Void) {
        completion(getEntry())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<HabbitEntry>) -> Void) {
        let entry = getEntry()
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }

    private func getEntry() -> HabbitEntry {
        guard let defaults = UserDefaults(suiteName: appGroup),
              let jsonString = defaults.string(forKey: "widgetData"),
              let data = jsonString.data(using: .utf8),
              let progress = try? JSONDecoder().decode(HabitProgress.self, from: data)
        else {
            return HabbitEntry(date: Date(), completed: 0, total: 0, streak: 0, habits: [], done: [])
        }
        return HabbitEntry(
            date: Date(),
            completed: progress.completed,
            total: progress.total,
            streak: progress.streak,
            habits: progress.habits,
            done: progress.done
        )
    }
}

// MARK: - Timeline Entry

struct HabbitEntry: TimelineEntry {
    let date: Date
    let completed: Int
    let total: Int
    let streak: Int
    let habits: [String]
    let done: [String]
}

// MARK: - Widget Views

struct HabbitWidgetSmall: View {
    let entry: HabbitEntry
    let coral = Color(red: 1.0, green: 0.42, blue: 0.28)

    var progress: Double {
        guard entry.total > 0 else { return 0 }
        return Double(entry.completed) / Double(entry.total)
    }

    var body: some View {
        VStack(spacing: 8) {
            ZStack {
                Circle()
                    .stroke(coral.opacity(0.2), lineWidth: 6)
                Circle()
                    .trim(from: 0, to: progress)
                    .stroke(coral, style: StrokeStyle(lineWidth: 6, lineCap: .round))
                    .rotationEffect(.degrees(-90))

                VStack(spacing: 0) {
                    Text("\(entry.completed)")
                        .font(.system(size: 22, weight: .bold))
                        .foregroundColor(coral)
                    Text("of \(entry.total)")
                        .font(.system(size: 10, weight: .medium))
                        .foregroundColor(.secondary)
                }
            }
            .frame(width: 64, height: 64)

            if entry.streak > 0 {
                HStack(spacing: 3) {
                    Image(systemName: "flame.fill")
                        .font(.system(size: 10))
                        .foregroundColor(.orange)
                    Text("\(entry.streak) day streak")
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundColor(.secondary)
                }
            }
        }
        .containerBackground(for: .widget) {
            Color(.systemBackground)
        }
    }
}

struct HabbitWidgetMedium: View {
    let entry: HabbitEntry
    let coral = Color(red: 1.0, green: 0.42, blue: 0.28)

    var progress: Double {
        guard entry.total > 0 else { return 0 }
        return Double(entry.completed) / Double(entry.total)
    }

    var body: some View {
        HStack(spacing: 16) {
            ZStack {
                Circle()
                    .stroke(coral.opacity(0.2), lineWidth: 7)
                Circle()
                    .trim(from: 0, to: progress)
                    .stroke(coral, style: StrokeStyle(lineWidth: 7, lineCap: .round))
                    .rotationEffect(.degrees(-90))

                VStack(spacing: 0) {
                    Text("\(entry.completed)/\(entry.total)")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(coral)
                    Text("done")
                        .font(.system(size: 10, weight: .medium))
                        .foregroundColor(.secondary)
                }
            }
            .frame(width: 72, height: 72)

            VStack(alignment: .leading, spacing: 4) {
                Text("Today's Habits")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundColor(.primary)

                ForEach(entry.habits.prefix(4), id: \.self) { habit in
                    let isDone = entry.done.contains(habit)
                    HStack(spacing: 5) {
                        Image(systemName: isDone ? "checkmark.circle.fill" : "circle")
                            .font(.system(size: 12))
                            .foregroundColor(isDone ? .green : .gray)
                        Text(habit)
                            .font(.system(size: 11, weight: isDone ? .regular : .medium))
                            .foregroundColor(isDone ? .secondary : .primary)
                            .strikethrough(isDone)
                            .lineLimit(1)
                    }
                }

                if entry.streak > 0 {
                    HStack(spacing: 3) {
                        Image(systemName: "flame.fill")
                            .font(.system(size: 10))
                            .foregroundColor(.orange)
                        Text("\(entry.streak) day streak")
                            .font(.system(size: 10, weight: .semibold))
                            .foregroundColor(.secondary)
                    }
                    .padding(.top, 2)
                }
            }

            Spacer()
        }
        .containerBackground(for: .widget) {
            Color(.systemBackground)
        }
    }
}

// MARK: - Widget Configuration

struct HabbitWidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    let entry: HabbitEntry

    var body: some View {
        switch family {
        case .systemMedium:
            HabbitWidgetMedium(entry: entry)
        default:
            HabbitWidgetSmall(entry: entry)
        }
    }
}

struct HabbitWidget: Widget {
    let kind: String = "HabbitWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: HabbitProvider()) { entry in
            HabbitWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Habbit Progress")
        .description("See your daily habit progress at a glance.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

@main
struct HabbitWidgetBundle: WidgetBundle {
    var body: some Widget {
        HabbitWidget()
    }
}
